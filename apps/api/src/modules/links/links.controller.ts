import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto';

@ApiTags('links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('links')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Generate an affiliate short link for a product+campaign+marketplace' })
  create(@Body() dto: CreateLinkDto) {
    return this.links.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all links with click counts' })
  findAll() {
    return this.links.findAll();
  }
}
