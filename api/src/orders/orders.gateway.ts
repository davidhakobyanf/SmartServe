import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Permission } from 'src/common/auth/permission';
import { UserStatus } from 'src/common/auth/user-status';
import { Order } from "src/entities/order.entity";
import { UsersService } from 'src/users/users.service';
import { hideOrdersFinancials } from './order-response';
import { ORDER_DOMAIN_EVENTS } from './order.events';



export const WS_NAMESPACE = 'orders';
export const WS_EVENTS = {
    ORDERS_UPDATED:'orders:updated',
    JOIN:'join',
} as const;
export const  WS_ROOMS = {
    ORDERS: 'orders',
    REVENUE: 'revenue',
} as const;
@WebSocketGateway({
    namespace:WS_NAMESPACE,
    cors:{
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    },
})
export class OrdersGateway {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    @WebSocketServer()
    server!: Server;

    @SubscribeMessage(WS_EVENTS.JOIN)
    async handleJoin(client: Socket) {
        const accessToken = String(
            client.handshake.auth?.accessToken ?? '',
        ).trim();

        if (!accessToken) {
            return { ok: false, error: 'Missing access token' };
        }

        try {
            const payload = await this.jwtService.verifyAsync<{ sub: string }>(
                accessToken,
            );
            const user = await this.usersService.findById(payload.sub);

            if (
                !user ||
                user.status !== UserStatus.ACTIVE ||
                !user.role ||
                !user.role.isActive
            ) {
                return { ok: false, error: 'User is not active' };
            }

            const permissions = this.usersService.getEffectivePermissions(user);
            if (!permissions.includes(Permission.ORDERS_VIEW)) {
                return { ok: false, error: 'Missing orders.view permission' };
            }

            await client.leave(WS_ROOMS.ORDERS);
            await client.leave(WS_ROOMS.REVENUE);
            await client.join(
                permissions.includes(Permission.REVENUE_VIEW)
                    ? WS_ROOMS.REVENUE
                    : WS_ROOMS.ORDERS,
            );
            return { ok: true };
        } catch {
            return { ok: false, error: 'Invalid or expired access token' };
        }
    }

    @OnEvent(ORDER_DOMAIN_EVENTS.CHANGED)
    onOrdersChanged(orders: Order[]) {
        this.server
            .to(WS_ROOMS.ORDERS)
            .emit(WS_EVENTS.ORDERS_UPDATED, hideOrdersFinancials(orders));
        this.server
            .to(WS_ROOMS.REVENUE)
            .emit(WS_EVENTS.ORDERS_UPDATED, orders);
    }
}
