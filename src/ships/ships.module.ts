import { Module } from '@nestjs/common';
import { ShipsResolver } from './ships.resolver';
import { ShipsService } from './ships.service';

@Module({
  providers: [ShipsResolver, ShipsService],
  exports: [ShipsService],
})
export class ShipsModule {}
