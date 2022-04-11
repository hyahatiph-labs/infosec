import { DataTypes, Model, Sequelize } from 'sequelize';

/*
 * Model for the Analytics block. It may be missing
 * data from conventional Monero blocks.
 */
export class Block extends Model {
    declare cumulativeDifficulty: bigint;
    declare difficulty: bigint;
    declare height: number;
    declare longTermWeight: number;
    declare majorVersion: number;
    declare minerTxHash: string;
    declare minerTxOutputAmount: bigint;
    declare minorVersion: number;
    declare nonce: bigint;
    declare numTxs: number;
    declare orphanStatus:false;
    declare prevHash: string;
    declare reward: bigint;
    declare size: number;
    declare timestamp: number;
    declare weight: number;
}

/**
 * Model for the Analytics transaction. It may be missing
 * data from conventional Monero transactions.
 * TODO: separate tables for inputs, outputs and ring signature
 * for more advanced association and analysis
 */
export class Tx extends Model {
    declare extra: number[];
    declare hash: string;
    declare height: number;
    declare inTxPool: boolean;
    declare isConfirmed: boolean;
    declare isDoubleSpendSeen: boolean;
    declare isFailed: boolean;
    declare isRelayed: boolean;
    declare numInputs: number;
    declare numOutputs: number;
    declare outputIndices: number[];
    declare prunableHash: string;
    declare rctSigType: number;
    declare rctSigFee: number;
    declare ringOutputIndices: number[];
    declare relay: boolean;
    declare size: number;
    declare unlockHeight: number;
    declare version: number;
}

/**
 * Pass the sequelize instance after database connectivity is established
 * and initialize Block and Tx models for synchronization.
 */
export const initializeModels = async (sequelize: Sequelize): Promise<void> => {
    // model initialization
    Block.init({
        cumulativeDifficulty: {
            type: DataTypes.BIGINT
        },
        difficulty: {
            type: DataTypes.BIGINT
        },
        height: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        longTermWeight: {
            type: DataTypes.INTEGER
          },
        majorVersion: {
            type: DataTypes.INTEGER
        },
        minerTxHash: {
            type: DataTypes.STRING
        },
        minerTxOutputAmount: {
            type: DataTypes.BIGINT
        },
        minorVersion: {
            type: DataTypes.INTEGER
        },
        nonce: {
            type: DataTypes.BIGINT
        },
        numTxs: {
            type: DataTypes.INTEGER
        },
        orphanStatus: {
            type: DataTypes.BOOLEAN
        },
        prevHash: {
            type: DataTypes.STRING
          },
        reward: {
            type: DataTypes.BIGINT
        },
        size: {
            type: DataTypes.INTEGER
        },
        timestamp: {
            type: DataTypes.INTEGER
        },
        weight: {
            type: DataTypes.INTEGER
        }
    }, {sequelize})
    Tx.init({
        extra: {
            type: DataTypes.ARRAY(DataTypes.INTEGER)
        },
        hash: {
            type: DataTypes.STRING,
        },
        height: {
            type: DataTypes.INTEGER,
        },
        inTxPool: {
            type: DataTypes.BOOLEAN
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN
        },
        isDoubleSpendSeen: {
            type: DataTypes.BOOLEAN
        },
        isFailed: {
            type: DataTypes.BOOLEAN
        },
        isRelayed: {
            type: DataTypes.BOOLEAN
        },
        numInputs: {
            type: DataTypes.INTEGER
        },
        numOutputs: {
            type: DataTypes.INTEGER
        },
        outputIndices: {
            type: DataTypes.ARRAY(DataTypes.INTEGER)
        },
        prunableHash: {
            type: DataTypes.STRING
        },
        rctSigType: {
            type: DataTypes.INTEGER
        },
        rctSigFee: {
            type: DataTypes.BIGINT
        },
        ringOutputIndices: {
            type: DataTypes.ARRAY(DataTypes.INTEGER)
        },
        relay: {
            type: DataTypes.BOOLEAN
          },
        size: {
            type: DataTypes.FLOAT,
        },
        unlockHeight: {
            type: DataTypes.INTEGER
        },
        version: {
            type: DataTypes.INTEGER
          }
    }, {sequelize})
}
