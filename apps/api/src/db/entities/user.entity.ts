import { Check, Column, Entity, Index, OneToOne } from 'typeorm';
import { AuthSessionEntity } from './auth-session.entity';
import { BaseEntity } from '../base.entity';

@Entity({ name: 'users' })
@Index('idx_users_created_at', ['createdAt'])
@Check(
  'CHK_users_password_hash_not_blank',
  `"password_hash" IS NULL OR btrim("password_hash") <> ''`,
)
export class UserEntity extends BaseEntity {
  @Column({
    type: 'text',
    unique: true,
  })
  email!: string;

  @Column({
    name: 'display_name',
    type: 'text',
    nullable: true,
  })
  displayName!: string | null;

  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: true,
  })
  passwordHash!: string | null;

  @OneToOne(() => AuthSessionEntity, (authSession) => authSession.user)
  authSession!: AuthSessionEntity | null;
}
