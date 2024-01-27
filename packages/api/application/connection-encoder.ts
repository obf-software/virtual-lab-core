import { RDPConnectionSettings, VNCConnectionSettings } from '../domain/dtos/connection-settings';

export interface ConnectionEncoder {
    encodeVncConnection(settings: VNCConnectionSettings): string;
    encodeRdpConnection(settings: RDPConnectionSettings): string;
}
