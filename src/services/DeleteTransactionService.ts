import { getCustomRepository } from 'typeorm'
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute(id: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const transaction = await transactionRepository.findOne(id);

    if(!transaction) {
      throw new AppError('transaction does not exist');
    }

    await transactionRepository.remove(transaction);

  }
}

export default DeleteTransactionService;
