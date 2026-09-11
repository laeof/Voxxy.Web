export type ConnectTransportState =
    | 'disconnected'
    | 'connecting'
    | 'registering'
    | 'recovering'
    | 'ready'
    | 'reconnecting'
    | 'unavailable';
export type ConnectSyncStatus =
    | 'Connected'
    | 'Reconnecting'
    | 'Disconnected'
    | 'Unavailable'
    | 'OutOfSync';

export type ConnectCommandAckStatus =
    | 'Applied'
    | 'Duplicate'
    | 'NoChanges'
    | 'Conflict'
    | 'CommandCollision'
    | 'ConnectionNotFound'
    | 'DeviceNotFound'
    | 'DeviceOffline'
    | 'QueueItemNotFound'
    | 'InvalidQueueIndex'
    | 'ValidationFailed'
    | 'CorruptState'
    | 'Unavailable';

export type RepeatModeContract = 'None' | 'Queue' | 'Track';
export type PlaybackSourceTypeContract =
    | 'Playlist'
    | 'Album'
    | 'Release'
    | 'LikedSongs'
    | 'Search'
    | 'Manual';

export interface PlayerStateDto {
    isPlaying: boolean;
    positionMs: number;
    positionUpdatedAt: string;
    volumePercent: number;
    version: number;
}

export interface QueueItemDto {
    queueItemId: string;
    trackId: string;
    canonicalOrder: number;
}

export interface QueueStateDto {
    items: QueueItemDto[];
    currentQueueItemId: string | null;
    repeatMode: RepeatModeContract;
    isShuffled: boolean;
    version: number;
    sourceId?: string | null;
    sourceType?: PlaybackSourceTypeContract | null;
}

export interface DeviceConnectionDto {
    connectionId: string;
    connectedAt: string;
}

export interface DeviceDto {
    deviceId: string;
    name: string;
    connections: DeviceConnectionDto[];
    isOnline: boolean;
}

export interface PresenceStateDto {
    devices: DeviceDto[];
    activeDeviceId: string | null;
    audioOwnerConnectionId: string | null;
    version: number;
}

export interface ConnectSnapshotResponse {
    status: ConnectCommandAckStatus;
    player: PlayerStateDto | null;
    queue: QueueStateDto | null;
    presence: PresenceStateDto | null;
    serverTime: string;
    errorCode: string | null;
}

export interface ConnectCommandOutcome {
    deviceId: string | null;
    connectionId: string | null;
    queueItemId: string | null;
    playerVersion: number | null;
    queueVersion: number | null;
    presenceVersion: number | null;
    removedConnectionCount: number | null;
}

export interface ConnectCommandAck {
    commandId: string | null;
    status: ConnectCommandAckStatus;
    errorCode: string | null;
    outcome: ConnectCommandOutcome | null;
}

export interface CommandRequest {
    commandId: string;
}

export interface RegisterConnectionRequest extends CommandRequest {
    deviceId: string;
    deviceName: string;
}

export interface PlayerStateChangedEvent {
    commandId: string;
    player: PlayerStateDto;
}

export interface QueueStateChangedEvent {
    commandId: string;
    queue: QueueStateDto;
}

export interface PresenceStateChangedEvent {
    commandId: string;
    presence: PresenceStateDto;
}

export interface PlayerQueueStateChangedEvent {
    commandId: string;
    player: PlayerStateDto;
    queue: QueueStateDto;
}

export interface PlayerPresenceStateChangedEvent {
    commandId: string;
    player: PlayerStateDto;
    presence: PresenceStateDto;
}
