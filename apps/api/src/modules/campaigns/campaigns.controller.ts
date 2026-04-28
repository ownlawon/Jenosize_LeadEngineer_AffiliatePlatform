import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/pagination.dto';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a campaign' })
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns (paginated, public)' })
  findAll(@Query() q: PaginationQueryDto) {
    return this.campaigns.findAll(q.page, q.pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one campaign with linked products (public)' })
  findOne(@Param('id') id: string) {
    return this.campaigns.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(@Param('id') id: string) {
    return this.campaigns.remove(id);
  }
}
