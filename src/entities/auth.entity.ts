
import { Provider } from 'src/auth.interface';
import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    socialId: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100 })
    email: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    nick: string;

    @Column({ type: 'enum', enum: Provider })
    provider: Provider;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
