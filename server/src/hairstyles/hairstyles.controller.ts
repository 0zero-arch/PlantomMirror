import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListHairstylesDto } from './dto/list-hairstyles.dto.js';
import { HairstylesService, type HairstyleView } from './hairstyles.service.js';

@ApiTags('hairstyles')
@Controller('hairstyles')
export class HairstylesController {
  constructor(private readonly hairstyles: HairstylesService) {}

  /**
   * 注意：这个接口**不要求**身份 —— 发型目录是公开信息，
   * 让客户端能在用户上传照片前就展示可选发型。
   * 需要身份的接口靠 @CurrentUser() 声明，见 current-user.decorator.ts。
   */
  @Get()
  @ApiOperation({ summary: '发型列表' })
  list(@Query() query: ListHairstylesDto): Promise<HairstyleView[]> {
    return this.hairstyles.list(query);
  }
}