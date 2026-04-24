import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity({ name: 'users' })
@Index('idx_users_created_at', ['createdAt'])
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
}
