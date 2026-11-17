import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class PageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ConnectGithubDto {
  // owner/repo, for example acme/shop-frontend
  @Matches(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, {
    message: "githubRepo must look like owner/repo",
  })
  githubRepo!: string;

  @IsOptional()
  @IsString()
  @MinLength(16)
  @MaxLength(200)
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  regenerateSecret?: boolean;
}
