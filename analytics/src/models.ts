import { DataTypes, Model, Sequelize } from 'sequelize';

/*
 * Model for the Analytics block. It may be missing
 * data from conventional Monero blocks.
 */
export class Block extends Model {
    declare cumulativeDifficulty: number;
    declare difficulty: number;
    declare height: number;
    declare longTermWeight: number;
    declare majorVersion: number;
    declare minerTxHash: string;
    declare minerTxOutputAmount: number;
    declare minorVersion: number;
    declare nonce: number;
    declare numTxs: number;
    declare orphanStatus:false;
    declare prevHash: string;
    declare reward: bigint;
    declare size: number;
    declare timestamp: number;
    declare txHashes: string[];
    declare weight: number;
}

/**
 * Model for the Analytics transaction. It may be missing
 * data from conventional Monero transactions.
 */
export class Tx extends Model {
    declare tx_height: number;
    declare data: string;
}

export const initializeModels = async (sequelize: Sequelize): Promise<void> => {
    // model initialization
    Block.init({
        cumulativeDifficulty: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        difficulty: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        height: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        longTermWeight: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        majorVersion: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        minorVersion: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        minerTxOutputAmount: {
            type: DataTypes.INTEGER,
          },
          weight: {
            type: DataTypes.INTEGER,
          },
    }, {sequelize})
    Tx.init({
        tx_height: {
            type: DataTypes.INTEGER,
            primaryKey: true
          },
        data: {
            type: DataTypes.TEXT
        }
    }, {sequelize})
}
