export enum SupportedChainId {
  RINKEBY = 4,
  GOERLI = 5,
}

export default {
  safeAddress: {
    goerli: {
      address: '0x44B735109ECF3F1A5FE56F50b9874cEf5Ae52fEa',
      network: SupportedChainId.GOERLI,
      owners: [
        '0x0905939Cae1b09287872c5D96a41617fF3Bb777a',
        '0xa1bD4AaB00f53e7C34bf5fD50DCc885cB918f2dE',
      ],
      serviceUri: 'https://safe-transaction.goerli.gnosis.io',
    },
    rinkeby: {
      address: '0x7a935d07d097146f143A45aA79FD8624353abD5D',
      network: SupportedChainId.RINKEBY,
      owners: [
        '0x0905939Cae1b09287872c5D96a41617fF3Bb777a',
        '0xa1bD4AaB00f53e7C34bf5fD50DCc885cB918f2dE',
      ],
      serviceUri: 'https://safe-transaction.rinkeby.gnosis.io',
    },
    gateway: 'https://safe-client.gnosis.io',
  },
  provider: {
    goerli: {
      rpc: 'https://goerli.infura.io/v3/97e75e0bbc6a4419a5dd7fe4a518b917',
      network: SupportedChainId.GOERLI,
    },
    rinkeby: {
      rpc: 'https://eth-rinkeby.alchemyapi.io/v2/l1u0wuvuvoqtYye4fFuY9C3NGZFKWhXC',
      network: SupportedChainId.RINKEBY,
    },
  },
  // owner's private key
  privateKey:
    '4922baa2b29bc35f9e52877d5f9cb2f2b3ebcce3df56eb9fe346a6bfdbedbcd8',
};

export const EMPTY_DATA = '0x';
