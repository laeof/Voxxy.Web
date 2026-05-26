export class ApiRoutes {
    public static readonly Follows = {
        getByUser: '/followees',
    };

    public static readonly Playlists = {
        getById: '/playlists/:id',
        getTracks: '/playlists/:id/tracks',
    };

    public static readonly Albums = {
        getById: '/albums/:id',
        getTracks: '/albums/:id/tracks',
    };

    public static readonly Auth = {
        login: '/users/login',
        logout: '/users/logout',
        refresh: '/users/refresh',
    };

    public static readonly Users = {
        me: '/users/me',
    };

    public static readonly Track = {
        stream: '/tracks/:id/stream',
    };

    public static readonly Artists = {
        getById: '/artists/:id',
    };
}
