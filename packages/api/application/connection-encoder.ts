import { RDPConnectionSettings, VNCConnectionSettings } from '../domain/dtos/connection-settings';

export interface ConnectionEncoder {
    encodeVncConnection(settings: VNCConnectionSettings): Promise<string>;
    encodeRdpConnection(settings: RDPConnectionSettings): Promise<string>;
}
