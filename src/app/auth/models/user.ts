import { UserClaim } from "./user-claim";

export class User {
    public id: string;
    public email: string;
    public fullName: string;
    public imageUrl: string;
    public userClaims: UserClaim[];

    constructor(obj: User) {
        this.id = obj.id || '';
        this.email = obj.email || '';
        this.fullName = obj.fullName || '';
        this.imageUrl = obj.imageUrl || '';
        this.userClaims = obj.userClaims || [];
    }
}