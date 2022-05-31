import Safe from '@gnosis.pm/safe-core-sdk';
import {
  MetaTransactionData,
  OperationType,
} from '@gnosis.pm/safe-core-sdk-types';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import { SafeEthersSigner, SafeService } from '@gnosis.pm/safe-ethers-adapters';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import { BigNumber, ethers } from 'ethers';

import ERC20Abi from './abis/ERC20.json';
import TransferAbi from './abis/transfer.json';
import config, { EMPTY_DATA, SupportedChainId } from './config';

async function proposeTransaction() {
  const provider = new ethers.providers.JsonRpcProvider(
    config.provider.rinkeby.rpc,
    config.provider.rinkeby.network
  );
  const signer = new ethers.Wallet(config.privateKey, provider);

  const network = SupportedChainId.RINKEBY;
  // Gnosis Safe address on Rinkeby
  const safeAddress = '0x7a935d07d097146f143A45aA79FD8624353abD5D';

  const receiptAddress = '0x8a6AAe4B05601CDe4cecbb99941f724D7292867b';
  // Token Address on Rinkeby
  const tokenAddress = '0xD53C3bddf27b32ad204e859EB677f709c80E6840';
  const decimals = 18;
  const amount = BigNumber.from(10).pow(decimals).mul(3000);

  const isSendingNativeToken = true;
  let txData = EMPTY_DATA;
  if (!isSendingNativeToken) {
    const erc20Interface = new ethers.utils.Interface(ERC20Abi.abi);
    txData = erc20Interface.encodeFunctionData('transfer', [
      receiptAddress,
      amount,
    ]);
  }

  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });
  const safeService = new SafeServiceClient(
    config.safeAddress.rinkeby.serviceUri
  );
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: config.safeAddress.rinkeby.address,
  });
  const nonce = await safeService.getNextNonce(safeAddress);
  console.log('nonce', nonce);

  const txArgs = !isSendingNativeToken
    ? {
        to: tokenAddress,
        valueInWei: '0',
        data: txData,
        operation: 0,
        nonce: Number(nonce),
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        sender: signer.address, // owner address
      }
    : {
        to: receiptAddress,
        valueInWei: '100000000000000',
        data: txData,
        operation: 0,
        nonce: Number(nonce),
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        sender: signer.address, // owner address
      };

  const transaction: SafeTransactionDataPartial = {
    to: txArgs.to,
    data: txArgs.data,
    value: txArgs.valueInWei,
    operation: txArgs.operation, // Optional
    safeTxGas: Number(txArgs.safeTxGas), // Optional
    baseGas: Number(txArgs.baseGas), // Optional
    gasPrice: Number(txArgs.gasPrice), // Optional
    gasToken: txArgs.gasToken, // Optional
    refundReceiver: txArgs.refundReceiver, // Optional
    nonce: txArgs.nonce, // Optional
  };

  const safeTransaction = await safe.createTransaction(transaction);

  await safe.signTransaction(safeTransaction);
  console.log('successfully signed transaction');

  const safeTxHash = await safe.getTransactionHash(safeTransaction);
  await safeService.proposeTransaction({
    safeAddress,
    senderAddress: txArgs.sender,
    safeTransaction,
    safeTxHash,
  });

  console.log('successfully proposed transaction');
}

async function executeTransaction() {
  const provider = new ethers.providers.JsonRpcProvider(
    config.provider.goerli.rpc,
    config.provider.goerli.network
  );
  const signer = new ethers.Wallet(config.privateKey, provider);

  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: config.safeAddress.goerli.address,
  });

  const transactionInfo: MetaTransactionData = {
    to: '0x22C38E74B8C0D1AAB147550BcFfcC8AC544E0D8C',
    value: BigNumber.from(10).pow(15).toString(), // 0.001
    data: '0x',
    operation: OperationType.Call,
  };

  const transaction = await safe.createTransaction([transactionInfo]);
  const hash = await safe.getTransactionHash(transaction);
  const safeSignature = await safe.signTransactionHash(hash);
  transaction.addSignature(safeSignature);
  console.log('transaction', transaction);
  await safe.executeTransaction(transaction);
}

async function waitUntilConfirmations() {
  const provider = new ethers.providers.JsonRpcProvider(
    config.provider.goerli.rpc,
    config.provider.goerli.network
  );
  const signer = new ethers.Wallet(config.privateKey, provider);

  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });
  const safe = await Safe.create({
    ethAdapter,
    safeAddress: config.safeAddress.goerli.address,
  });

  const service = new SafeService('https://safe-transaction.goerli.gnosis.io');
  const safeSigner = new SafeEthersSigner(safe, service, signer.provider);
  const transferContract = new ethers.Contract(
    '0xa80152CB820463a1B50228D2b8dE50717E849BBd',
    TransferAbi,
    safeSigner
  );
  console.log('transacting');
  const tx = await transferContract.connect(safeSigner).transfer(
    '0x22c38e74b8c0d1aab147550bcffcc8ac544e0d8c',
    BigNumber.from(10).pow(18).mul(1000).toString() // 1000 tokens
  );
  console.log('waiting transaction');
  await tx.wait();
  console.log('complete transaction');
}

async function main() {
  // propose transaction on Gnosis Safe what transfer tokens to target
  await proposeTransaction();

  // execute transactions on Gnosis Safe with signing by owners
  // await executeTransaction();

  // propose transaction on Gnosis Safe and wait until all confirmations has been finished
  // await waitUntilConfirmations();
}

main()
  .then(() => {
    console.log('Gnosis Safe Execution then');
  })
  .catch((err) => {
    console.log('Gnosis Safe Execution catch', err);
  });

export {};
