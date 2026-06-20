export class ApiRoutes {
    public static readonly Follows = {
        getByUser: '/followees',
        follow: '/followees',
        unfollow: '/followees',
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
        xsrf: '/users/xsrf-token',
    };

    public static readonly Users = {
        me: '/users/me',
        getById: '/users/:id',
    };

    public static readonly Track = {
        stream: '/tracks/:id/stream',
    };

    public static readonly Artists = {
        getById: '/artists/:id',
        getArtistsOnAccount: '/artists/on-account',
    };

    public static readonly ForArtists = {
        releases: '/for-artist/releases',
        searchGenres: '/for-artist/genres',
        searchMoods: '/for-artist/moods',
        searchArtists: '/for-artist/artists',
    }
}
