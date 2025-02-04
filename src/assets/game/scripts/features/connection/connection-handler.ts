import inversify from "inversify";
import { ConnectionStore, ISocketOption } from "./connection-store";

const { inject, injectable } = inversify;

@injectable()
export class ConnectHandler {
    @inject(ConnectionStore) protected readonly store: ConnectionStore;
    constructor() {}

    handle(customizeOptions?: ISocketOption) {
        this.store.initConnection(customizeOptions);
    }
}
