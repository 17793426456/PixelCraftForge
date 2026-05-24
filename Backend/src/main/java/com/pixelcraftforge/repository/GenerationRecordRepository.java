package com.pixelcraftforge.repository;

import com.pixelcraftforge.entity.GenerationRecord;
import com.pixelcraftforge.entity.AssetGenerationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GenerationRecordRepository extends JpaRepository<GenerationRecord, Long> {

    Optional<GenerationRecord> findByExternalTaskId(String externalTaskId);

    Page<GenerationRecord> findByGenerationType(AssetGenerationType generationType, Pageable pageable);
}
