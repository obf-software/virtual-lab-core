import { RDPConnectionSettings, VNCConnectionSettings } from '../domain/dtos/connection-encoder';

export interface ConnectionEncoder {
    encodeVncConnection(settings: VNCConnectionSettings): string;
    encodeRdpConnection(settings: RDPConnectionSettings): string;
}
