package com.medical.platform.repository;

import com.medical.platform.entity.Pharmacie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacieRepository extends JpaRepository<Pharmacie, Long> {
    Optional<Pharmacie> findByPharmacienId(Long pharmacienId);
}
