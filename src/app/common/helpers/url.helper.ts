export class UrlHelper {
    static transform(url: string, key: string, value: string) {
        return url.replace(`${key}`, value);
    }
}
