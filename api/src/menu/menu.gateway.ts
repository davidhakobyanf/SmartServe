import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";



export const WS_NAMESPACE = 'menu';
export const WS_EVENTS = {
    MENU_UPDATED:'menu:updated'
} as const;

export const DOMAIN_EVENTS = {
    MENU_CHANGED: 'menu.changed',
} as const;

export type MenuProfilePayload = {
    name:string;
    surname:string;
    card:unknown[];
};

@WebSocketGateway({
    namespace:WS_NAMESPACE,
    cors:{
        origin:process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials:true,
    },
})

export class MenuGateway {
    @WebSocketServer()
    server!:Server;

    @OnEvent(DOMAIN_EVENTS.MENU_CHANGED)
    onMenuChanged(profile: MenuProfilePayload) {
        this.server.emit(WS_EVENTS.MENU_UPDATED,profile);
    }
}
