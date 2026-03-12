package com.medical.platform.repository;

import com.medical.platform.entity.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicamentRepository extends JpaRepository<Medicament, Long> {
    Optional<Medicament> findByNom(String nom);

    @Query("SELECT m FROM Medicament m WHERE LOWER(m.nom) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Medicament> findByNomContainingIgnoreCase(@Param("name") String name);

    @Query("SELECT m FROM Medicament m WHERE LOWER(m.dci) = LOWER(:dci)")
    List<Medicament> findByDciIgnoreCase(@Param("dci") String dci);
}
