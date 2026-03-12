package com.medical.platform.repository;

import com.medical.platform.entity.StockMedicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import com.medical.platform.entity.Pharmacie;

@Repository
public interface StockMedicamentRepository extends JpaRepository<StockMedicament, Long> {

    long countByPharmacie(Pharmacie pharmacie);

    List<StockMedicament> findByPharmacie(Pharmacie pharmacie);

    @Query("SELECT sm FROM StockMedicament sm WHERE sm.medicament.id = :medicamentId AND sm.quantiteDisponible > 0 AND (sm.datePeremption IS NULL OR sm.datePeremption > :today)")
    List<StockMedicament> findAvailableNonExpiredStockByMedicamentId(
            @Param("medicamentId") Long medicamentId,
            @Param("today") LocalDate today);
}
