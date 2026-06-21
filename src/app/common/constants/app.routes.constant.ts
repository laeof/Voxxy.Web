export class AppRoutes {
    public static readonly layout = '';
    public static readonly home = 'home';
    public static readonly playlist = 'playlist/:id';
    public static readonly artist = 'artist/:id';
    public static readonly album = 'album/:id';
    public static readonly user = 'user/:id';
    public static readonly auth = 'auth';
    public static readonly userProfile = 'user/:id';
    public static readonly track = 'track/:id';

    public static readonly forArtist = 'for-artist';

    public static readonly forArtistDashboard = 'dashboard';

    public static readonly forArtistReleases = 'releases';
    public static readonly forArtistReleasesAll = 'all';
    public static readonly forArtistReleasesCreate = 'create';
    public static readonly forArtistReleasesCreateAddReleaseInformation = 'add-information';
    public static readonly forArtistReleasesCreateUploadTracks = 'upload-tracks';
    public static readonly forArtistReleasesCreatePublish = 'publish';

    public static readonly forArtistAnalytics = 'analytics';

    public static readonly forArtistSettings = 'settings';
}
