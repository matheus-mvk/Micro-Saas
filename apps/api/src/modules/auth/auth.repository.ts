import { Injectable } from '@nestjs/common';
import { UserStatus, type Prisma, type RefreshToken, type Tenant, type User } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export type AuthUserRecord = User & { tenant: Tenant };
export type RefreshTokenRecord = RefreshToken & { user: AuthUserRecord };

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveLoginCandidates(email: string, tenantSlug?: string): Promise<AuthUserRecord[]> {
    return this.prisma.user.findMany({
      where: {
        email,
        status: UserStatus.ACTIVE,
        tenant: {
          active: true,
          ...(tenantSlug ? { slug: tenantSlug } : {}),
        },
      },
      include: { tenant: true },
      take: 2,
    });
  }

  async findActiveUserById(userId: string, tenantId: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        status: UserStatus.ACTIVE,
        tenant: { active: true },
      },
      include: { tenant: true },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } },
    });
  }

  async createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  async rotateRefreshToken(input: {
    currentTokenId: string;
    expiresAt: Date;
    familyId: string;
    ipHash?: string | undefined;
    tenantId: string;
    tokenHash: string;
    userAgent?: string | undefined;
    userId: string;
  }): Promise<void> {
    const nextTokenData: Prisma.RefreshTokenUncheckedCreateInput = {
      expiresAt: input.expiresAt,
      familyId: input.familyId,
      tenantId: input.tenantId,
      tokenHash: input.tokenHash,
      userId: input.userId,
    };

    if (input.ipHash) nextTokenData.ipHash = input.ipHash;
    if (input.userAgent) nextTokenData.userAgent = input.userAgent;

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: input.currentTokenId },
        data: { revokedAt: new Date(), rotatedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: nextTokenData,
      }),
    ]);
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
