import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Provider } from '../auth.interface';

@Entity()
class User {
	@PrimaryColumn({ name: 'social_id', type: 'varchar', length: 100 })
	socialId: string;

	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Column({ type: 'varchar', length: 100 })
	email: string;

	@Column({ type: 'varchar', length: 100, unique: true })
	nick: string;

	@Column({ type: 'enum', enum: Provider })
	provider: Provider;

	@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
	createdAt: Date;
}
export default User;
