import inversify from "inversify";
import mobx from "mobx";
import gc from "@sg/game-client-base";
import socketIo from "socket.io-client/dist/socket.io.js";
const { injectable, inject } = inversify;

export interface ISocketOption {
    socketUri: string;
    proxyRoute?: string;
    forceNew?: boolean;
    enableMsgpackParser?: boolean;
    transports?: string[];
    upgrade?: boolean;
    path?: string;
    extraHeaders?: { [header: string]: string };
}

@injectable()
export class ConnectionStore {
    connection: socketIo.Socket = null;
    isConnected: boolean = null;
    isConnectFailed = false;
    isDisconnect = false;

    @inject(gc.GameConfigs.GameSetting) protected readonly gameSetting: gc.GameConfigs.GameSetting;
    @inject(gc.Configs.SiteConfigs) protected readonly siteConfigs: gc.Configs.SiteConfigs;
    @inject(gc.Shared.Mediator) protected readonly mediator: gc.Shared.Mediator;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    initConnection(customizeOptions?: ISocketOption) {
        this.reset();

        const gameId = this.gameSetting.id;
        const socketUri = this.buildServerUrl("http", `${this.siteConfigs.websocket.proxyPath}`, gameId, this.siteConfigs);
        const optionsDefault: ISocketOption = {
            path: this.getProxyRoute(this.siteConfigs),
            socketUri,
            transports: ["websocket"],
            upgrade: false,
            forceNew: true,
        };
        const options = { ...optionsDefault, ...customizeOptions };

        if (this.siteConfigs.enableMsgpackParserAllGames) {
            this.connection = socketIo.io(options.socketUri, options);
        } else {
            this.connection = socketIo.io(options.socketUri, options);
        }

        this.initBaseListener();
    }

    initBaseListener() {
        if (this.connection) {
            this.connection.on("connect", this.onConnected.bind(this));
        }
    }

    onConnected() {
        this.isConnected = true;
        this.connection.onAny(this.onHandleData.bind(this));
        this.send("join", {});
    }

    onHandleData(event: string, data: any) {
        if (event?.toLocaleLowerCase() === this.gameSetting?.name.toLocaleLowerCase() || event?.toLocaleLowerCase() === "message") {
            Object.entries(data).forEach((entry) => {
                const [key, value] = entry;
                this.mediator.emit(key, value);
            });
        } else {
            this.mediator.emit(event, data);
        }
    }

    reset() {
        this.connection = null;
        this.isConnected = null;
        this.isConnectFailed = false;
        this.isDisconnect = false;
    }

    buildServerUrl = (protocol = "http", path = "/", gameId = 0, configs: gc.Configs.SiteConfigs) => {
        const gamePath = this.getPath(gameId, path);
        return this.buildUrl(protocol, gamePath, configs, configs.gameServiceSubDomain);
    };

    send(eventName: string, data: any) {
        this.connection?.emit(eventName, data);
    }

    getPath = (gameId: number, path: string) => {
        path = path.toLowerCase();
        let pathStr = "";
        if (gameId === 0) {
            pathStr = `/${path}`;
        } else {
            pathStr = `/stream/${path}`;
        }

        return pathStr;
    };

    buildUrl = (protocol = "http", path = "/", configs: gc.Configs.SiteConfigs, overideSubDomain: string = null) => {
        const ssl = configs.ssl;
        const domain = this.getRootDomain(configs);
        const subDomain = overideSubDomain ?? configs.subDomain;
        const subDomainText = `${subDomain}.`;

        return `${protocol}${ssl ? "s" : ""}://${subDomain === "" ? "" : subDomainText}${domain}${path}`;
    };

    getRootDomain = (configs: gc.Configs.SiteConfigs) => {
        const hostName = window.location.hostname;
        return (!!configs.serverDomainMapper && configs.serverDomainMapper[hostName]) || this.extractDomainFromHostName(hostName);
    };

    extractDomainFromHostName = (hostName: string) => {
        const domainParts = hostName.split(".").reverse();
        return `${domainParts[1]}.${domainParts[0]}`;
    };

    getProxyRoute = (configs: gc.Configs.SiteConfigs) => {
        if (configs?.websocket?.route === "") {
            return "/socket.io";
        }

        const subDirectory = configs?.subDirectory ? `${configs?.subDirectory}/` : "";
        return `/${subDirectory}${configs?.websocket?.route}/socket.io`;
    };
}
