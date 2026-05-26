export class UserClaim {
    value: string = '';

    constructor(obj: any) {
        this.value = (obj && obj.value) || '';
    }
}
