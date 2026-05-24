ALTER TABLE generation_record
    ADD COLUMN asset_category VARCHAR(32) NOT NULL DEFAULT 'CHARACTER'
        COMMENT '资源分类: CHARACTER/WEAPON/SCENE/SKILL';

CREATE INDEX idx_asset_category ON generation_record (asset_category);
