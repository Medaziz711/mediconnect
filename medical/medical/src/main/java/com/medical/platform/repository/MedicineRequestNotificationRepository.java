package com.medical.platform.repository;

import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.MedicineRequestNotification;
import com.medical.platform.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRequestNotificationRepository extends JpaRepository<MedicineRequestNotification, Long> {

    @Query("SELECT n FROM MedicineRequestNotification n WHERE n.medecin = :medecin AND n.read = :read ORDER BY n.createdAt DESC")
    List<MedicineRequestNotification> findByMedecinAndReadOrderByCreatedAtDesc(@Param("medecin") Medecin medecin, @Param("read") Boolean read);

    @Query("SELECT n FROM MedicineRequestNotification n WHERE n.medecin = :medecin AND n.read = false ORDER BY n.createdAt DESC")
    List<MedicineRequestNotification> findByMedecinAndReadFalseOrderByCreatedAtDesc(@Param("medecin") Medecin medecin);

    List<MedicineRequestNotification> findByPatientOrderByCreatedAtDesc(Patient patient);

    @Query("SELECT n FROM MedicineRequestNotification n WHERE n.patient.id = :patientId AND n.medicineName = :medicineName ORDER BY n.createdAt DESC")
    List<MedicineRequestNotification> findByPatientIdAndMedicineName(@Param("patientId") Long patientId, @Param("medicineName") String medicineName);
}
