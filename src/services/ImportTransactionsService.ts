import { getCustomRepository,getRepository ,In } from 'typeorm'
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import uploadCSV from '../config/loadCsv';
import TransactionRepository from '../repositories/TransactionsRepository';
import fs from 'fs';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    // const csvFilePath = path.resolve(__dirname, '..', 'config', 'import_template.csv');

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const dataImported = await uploadCSV(filePath);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    dataImported.map(data => {
      const title = data[0];
      const type = data[1] === 'income' ? 'income' : 'outcome';
      const value = parseFloat(data[2]);
      const category = data[3];

      categories.push(category);

      transactions.push({title, type, value, category});
    });

    //Check with we have some equal value of category in database
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      }
    });

    //Get just category title from array existentCategories
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    //Get just the categories that need to be added in database
    const addCategoryTitles = categories.filter(
      category => !existentCategoriesTitles.includes(category),
    ).filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [ ...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
    
    // console.log("addCategoryTitles", addCategoryTitles);
    // console.log("existentCategoriesTitles", existentCategoriesTitles);
    // console.log("existentCategories", existentCategories);
    // console.log("categories", categories);
    // console.log("transactions", transactions);

  }
}

export default ImportTransactionsService;
