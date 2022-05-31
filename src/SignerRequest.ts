import { Signature } from '@ethersproject/bytes';
import { ethers } from 'ethers';

export type RequestType = {
  to: string;
  value: string;
  data: string;
  operation: number;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
};

export type RequestWithSignature = RequestType & {
  v: number;
  r: string;
  s: string;
};

const EIP712DOMAIN_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    // 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    'EIP712Domain(uint256 chainId,address verifyingContract)'
  )
);

const getDomainSeparator = (
  // name: string,
  // version: string,
  chainId: number,
  address: string
) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        'bytes32',
        // 'bytes32', 'bytes32',
        'uint256',
        'address',
      ],
      [
        EIP712DOMAIN_TYPEHASH,
        // ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
        // ethers.utils.keccak256(ethers.utils.toUtf8Bytes(version)),
        chainId,
        address,
      ]
    )
  );
};

class SignerRequest {
  // keccak256("SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)")
  static REQUEST_TYPEHASH =
    '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8';

  public request: RequestType;

  constructor(
    to: string,
    value: string,
    data: string,
    operation: number,
    safeTxGas: string,
    baseGas: string,
    gasPrice: string,
    gasToken: string,
    refundReceiver: string,
    nonce: number
  ) {
    this.request = {
      to,
      value,
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      nonce,
    };
  }

  hash(overrides?: RequestType) {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        [
          'bytes32',
          'address',
          'uint256',
          'bytes',
          'uint8',
          'uint256',
          'uint256',
          'uint256',
          'address',
          'address',
          'uint256',
        ],
        [
          SignerRequest.REQUEST_TYPEHASH,
          overrides?.to || this.request.to,
          overrides?.value || this.request.value,
          overrides?.data || this.request.data,
          overrides?.operation || this.request.operation,
          overrides?.safeTxGas || this.request.safeTxGas,
          overrides?.baseGas || this.request.baseGas,
          overrides?.gasPrice || this.request.gasPrice,
          overrides?.gasToken || this.request.gasToken,
          overrides?.refundReceiver || this.request.refundReceiver,
          overrides?.nonce || this.request.nonce,
        ]
      )
    );
  }

  async sign(
    chainId: number,
    privateKey: string,
    verifyingContract: string,
    overrides?: RequestType
  ): Promise<Signature> {
    const DOMAIN_SEPARATOR = getDomainSeparator(
      // 'GnosisSafe',
      // '1.13.0',
      chainId,
      verifyingContract
    );
    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        ['0x19', '0x01', DOMAIN_SEPARATOR, this.hash(overrides)]
      )
    );
    const key = new ethers.utils.SigningKey(ethers.utils.hexlify(privateKey));
    const signDigest = key.signDigest.bind(key);
    const signature = ethers.utils.joinSignature(signDigest(digest));

    return ethers.utils.splitSignature(signature);
  }
}

export default SignerRequest;
