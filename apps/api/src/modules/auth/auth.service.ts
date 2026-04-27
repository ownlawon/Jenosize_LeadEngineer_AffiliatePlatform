import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * On first boot, seed an admin user from env vars if no User exists.
   * Idempotent — does nothing if any user is already present.
   */
  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count > 0) return;
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.log.warn('No users in DB and ADMIN_EMAIL/ADMIN_PASSWORD not set — login will fail');
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    await this.prisma.user.create({ data: { email, password: hash } });
    this.log.log(`Seeded initial admin user: ${email}`);
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { id: user.id, email: user.email };
  }

  signToken(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }

  async login(email: string, password: string) {
    const user = await this.validate(email, password);
    const token = this.signToken({ sub: user.id, email: user.email });
    return { user, token };
  }
}
