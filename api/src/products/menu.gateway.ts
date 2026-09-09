import { OnEvent } from "@nestjs/event-emitter";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import {
  PRODUCT_DOMAIN_EVENTS,
  ProductChangedPayload,
} from "./product.events";

export const MENU_WS_NAMESPACE = "menu";
export const MENU_WS_EVENTS = {
  UPDATED: "menu:updated",
} as const;

@WebSocketGateway({
  namespace: MENU_WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class MenuGateway {
  @WebSocketServer()
  server!: Server;

  @OnEvent(PRODUCT_DOMAIN_EVENTS.CHANGED)
  onProductChanged(payload: ProductChangedPayload) {
    this.server.emit(MENU_WS_EVENTS.UPDATED, payload);
  }

  @OnEvent('menu:catalog-changed')
  onCatalogChanged() {
    this.server.emit(MENU_WS_EVENTS.UPDATED, { reason: 'catalog-changed' });
  }
}
