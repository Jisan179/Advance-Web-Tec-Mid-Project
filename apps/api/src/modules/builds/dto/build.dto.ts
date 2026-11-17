import { ApprovalDecision } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class DecisionDto {
  @IsEnum(ApprovalDecision)
  decision!: ApprovalDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
