import { getCustomRepository, getRepository } from 'typeorm'

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string,
  value: number,
  type: 'income' | 'outcome',
  category: string
}

class CreateTransactionService {
  public async execute({ title, value,type, category }:RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    if(type === "outcome") {
      const {income, total} = await transactionRepository.getBalance();

      if(income < value || total < value) {
        throw new AppError('Theres no balance enough.', 400);
      }
    }

    let checkCategoryExists = null;

    checkCategoryExists = await categoryRepository.findOne({
        where: { title: category }
    });

    if(!checkCategoryExists) {
      checkCategoryExists = categoryRepository.create({
        title: category
      });

      await categoryRepository.save(checkCategoryExists);

    }

    const transaction = transactionRepository.create({
      title, 
      value,
      type, 
      category: checkCategoryExists
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
