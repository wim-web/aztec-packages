import { Buffer32 } from '@aztec/foundation/buffer';
import { keccak256, recoverAddress } from '@aztec/foundation/crypto';
import type { EthAddress } from '@aztec/foundation/eth-address';
import { Signature } from '@aztec/foundation/eth-signature';
import { Fr } from '@aztec/foundation/fields';
import { BufferReader, serializeToBuffer } from '@aztec/foundation/serialize';

import { ConsensusPayload } from './consensus_payload.js';
import { Gossipable } from './gossipable.js';
import {
  SignatureDomainSeparator,
  getHashedSignaturePayload,
  getHashedSignaturePayloadEthSignedMessage,
} from './signature_utils.js';
import { TopicType } from './topic_type.js';

export class BlockProposalHash extends Buffer32 {
  constructor(hash: Buffer) {
    super(hash);
  }
}

/**
 * BlockProposal
 *
 * A block proposal is created by the leader of the chain proposing a sequence of transactions to
 * be included in the head of the chain
 */
export class BlockProposal extends Gossipable {
  static override p2pTopic = TopicType.block_proposal;

  private sender: EthAddress | undefined;

  constructor(
    /** The number of the block */
    public readonly blockNumber: Fr,

    /** The payload of the message, and what the signature is over */
    public readonly payload: ConsensusPayload,

    /** The signer of the BlockProposal over the header of the new block*/
    public readonly signature: Signature,
  ) {
    super();
  }

  override p2pMessageIdentifier(): Promise<Buffer32> {
    return Promise.resolve(new BlockProposalHash(keccak256(this.signature.toBuffer())));
  }

  get archive(): Fr {
    return this.payload.archive;
  }

  get slotNumber(): Fr {
    return this.payload.header.slotNumber;
  }

  static async createProposalFromSigner(
    blockNumber: Fr,
    payload: ConsensusPayload,
    payloadSigner: (payload: Buffer32) => Promise<Signature>,
  ) {
    const hashed = getHashedSignaturePayload(payload, SignatureDomainSeparator.blockProposal);
    const sig = await payloadSigner(hashed);

    return new BlockProposal(blockNumber, payload, sig);
  }

  /**Get Sender
   * Lazily evaluate the sender of the proposal; result is cached
   */
  getSender() {
    if (!this.sender) {
      const hashed = getHashedSignaturePayloadEthSignedMessage(this.payload, SignatureDomainSeparator.blockProposal);
      // Cache the sender for later use
      this.sender = recoverAddress(hashed, this.signature);
    }

    return this.sender;
  }

  getPayload() {
    return this.payload.getPayloadToSign(SignatureDomainSeparator.blockProposal);
  }

  toBuffer(): Buffer {
    return serializeToBuffer([this.blockNumber, this.payload, this.signature]);
  }

  static fromBuffer(buf: Buffer | BufferReader): BlockProposal {
    const reader = BufferReader.asReader(buf);
    return new BlockProposal(reader.readObject(Fr), reader.readObject(ConsensusPayload), reader.readObject(Signature));
  }

  getSize(): number {
    return this.blockNumber.size + this.payload.getSize() + this.signature.getSize();
  }
}
