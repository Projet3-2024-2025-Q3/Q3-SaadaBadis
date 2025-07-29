package be.helha.gdprapp;

import be.helha.gdprapp.models.Company;
import be.helha.gdprapp.repositories.CompanyRepository;
import be.helha.gdprapp.services.CompanyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    private Company testCompany;
    private List<Company> testCompanies;

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setIdCompany(1);
        testCompany.setCompanyName("Test Company");
        testCompany.setEmail("test@company.com");

        testCompanies = new ArrayList<>();
        testCompanies.add(testCompany);

        Company secondCompany = new Company();
        secondCompany.setIdCompany(2);
        secondCompany.setCompanyName("Second Company");
        secondCompany.setEmail("second@company.com");
        testCompanies.add(secondCompany);
    }

    @Test
    void getAllCompanies_ShouldReturnAllCompanies() {
        // Given
        when(companyRepository.findAll()).thenReturn(testCompanies);

        // When
        List<Company> result = companyService.getAllCompanies();

        // Then
        assertEquals(2, result.size());
        assertEquals("Test Company", result.get(0).getCompanyName());
        verify(companyRepository).findAll();
    }

    @Test
    void getCompanyById_WhenCompanyExists_ShouldReturnCompany() {
        // Given
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));

        // When
        Optional<Company> result = companyService.getCompanyById(1);

        // Then
        assertTrue(result.isPresent());
        assertEquals("Test Company", result.get().getCompanyName());
        verify(companyRepository).findById(1);
    }

    @Test
    void getCompanyById_WhenCompanyDoesNotExist_ShouldReturnEmpty() {
        // Given
        when(companyRepository.findById(999)).thenReturn(Optional.empty());

        // When
        Optional<Company> result = companyService.getCompanyById(999);

        // Then
        assertFalse(result.isPresent());
        verify(companyRepository).findById(999);
    }

    @Test
    void getCompanyByEmail_WhenCompanyExists_ShouldReturnCompany() {
        // Given
        when(companyRepository.findByEmail("test@company.com")).thenReturn(Optional.of(testCompany));

        // When
        Optional<Company> result = companyService.getCompanyByEmail("test@company.com");

        // Then
        assertTrue(result.isPresent());
        assertEquals("Test Company", result.get().getCompanyName());
        verify(companyRepository).findByEmail("test@company.com");
    }

    @Test
    void getCompanyByName_WhenCompanyExists_ShouldReturnCompany() {
        // Given
        when(companyRepository.findByCompanyName("Test Company")).thenReturn(Optional.of(testCompany));

        // When
        Optional<Company> result = companyService.getCompanyByName("Test Company");

        // Then
        assertTrue(result.isPresent());
        assertEquals("test@company.com", result.get().getEmail());
        verify(companyRepository).findByCompanyName("Test Company");
    }

    @Test
    void existsByEmail_WhenCompanyExists_ShouldReturnTrue() {
        // Given
        when(companyRepository.existsByEmail("test@company.com")).thenReturn(true);

        // When
        boolean result = companyService.existsByEmail("test@company.com");

        // Then
        assertTrue(result);
        verify(companyRepository).existsByEmail("test@company.com");
    }

    @Test
    void existsByName_WhenCompanyExists_ShouldReturnTrue() {
        // Given
        when(companyRepository.existsByCompanyName("Test Company")).thenReturn(true);

        // When
        boolean result = companyService.existsByName("Test Company");

        // Then
        assertTrue(result);
        verify(companyRepository).existsByCompanyName("Test Company");
    }

    @Test
    void createCompany_WithValidData_ShouldCreateCompany() {
        // Given
        Company newCompany = new Company("New Company", "new@company.com");
        when(companyRepository.existsByEmail("new@company.com")).thenReturn(false);
        when(companyRepository.existsByCompanyName("New Company")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenReturn(newCompany);

        // When
        Company result = companyService.createCompany(newCompany);

        // Then
        assertNotNull(result);
        assertEquals("New Company", result.getCompanyName());
        assertEquals("new@company.com", result.getEmail());
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    void createCompany_WithNullName_ShouldThrowException() {
        // Given
        Company invalidCompany = new Company(null, "test@company.com");

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.createCompany(invalidCompany)
        );

        assertEquals("Company name cannot be null or empty", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void createCompany_WithEmptyName_ShouldThrowException() {
        // Given
        Company invalidCompany = new Company("   ", "test@company.com");

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.createCompany(invalidCompany)
        );

        assertEquals("Company name cannot be null or empty", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void createCompany_WithNullEmail_ShouldThrowException() {
        // Given
        Company invalidCompany = new Company("Test Company", null);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.createCompany(invalidCompany)
        );

        assertEquals("Company email cannot be null or empty", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void createCompany_WithExistingEmail_ShouldThrowException() {
        // Given
        Company newCompany = new Company("New Company", "test@company.com");
        when(companyRepository.existsByEmail("test@company.com")).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.createCompany(newCompany)
        );

        assertEquals("Company with this email already exists", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void createCompany_WithExistingName_ShouldThrowException() {
        // Given
        Company newCompany = new Company("Test Company", "new@company.com");
        when(companyRepository.existsByEmail("new@company.com")).thenReturn(false);
        when(companyRepository.existsByCompanyName("Test Company")).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.createCompany(newCompany)
        );

        assertEquals("Company with this name already exists", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void updateCompany_WithValidData_ShouldUpdateCompany() {
        // Given
        Company updatedDetails = new Company("Updated Company", "updated@company.com");
        when(companyRepository.findById(1)).thenReturn(Optional.of(testCompany));
        when(companyRepository.existsByEmail("updated@company.com")).thenReturn(false);
        when(companyRepository.existsByCompanyName("Updated Company")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);

        // When
        Company result = companyService.updateCompany(1, updatedDetails);

        // Then
        assertNotNull(result);
        verify(companyRepository).save(testCompany);
    }

    @Test
    void updateCompany_WhenCompanyNotFound_ShouldThrowException() {
        // Given
        Company updatedDetails = new Company("Updated Company", "updated@company.com");
        when(companyRepository.findById(999)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.updateCompany(999, updatedDetails)
        );

        assertEquals("Company not found with id: 999", exception.getMessage());
        verify(companyRepository, never()).save(any(Company.class));
    }

    @Test
    void deleteCompany_WhenCompanyExists_ShouldDeleteCompany() {
        // Given
        when(companyRepository.existsById(1)).thenReturn(true);

        // When
        companyService.deleteCompany(1);

        // Then
        verify(companyRepository).deleteById(1);
    }

    @Test
    void deleteCompany_WhenCompanyDoesNotExist_ShouldThrowException() {
        // Given
        when(companyRepository.existsById(999)).thenReturn(false);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                companyService.deleteCompany(999)
        );

        assertEquals("Company not found with id: 999", exception.getMessage());
        verify(companyRepository, never()).deleteById(999);
    }

    @Test
    void getCompaniesCount_ShouldReturnCount() {
        // Given
        when(companyRepository.count()).thenReturn(5L);

        // When
        long result = companyService.getCompaniesCount();

        // Then
        assertEquals(5L, result);
        verify(companyRepository).count();
    }

    @Test
    void searchCompaniesByName_WithValidName_ShouldReturnMatches() {
        // Given
        when(companyRepository.findByCompanyNameContainingIgnoreCase("Test"))
                .thenReturn(testCompanies);

        // When
        List<Company> result = companyService.searchCompaniesByName("Test");

        // Then
        assertEquals(2, result.size());
        verify(companyRepository).findByCompanyNameContainingIgnoreCase("Test");
    }

    @Test
    void searchCompaniesByName_WithEmptyName_ShouldReturnAllCompanies() {
        // Given
        when(companyRepository.findAll()).thenReturn(testCompanies);

        // When
        List<Company> result = companyService.searchCompaniesByName("");

        // Then
        assertEquals(2, result.size());
        verify(companyRepository).findAll();
        verify(companyRepository, never()).findByCompanyNameContainingIgnoreCase(anyString());
    }

    @Test
    void searchCompaniesByEmail_WithValidEmail_ShouldReturnMatches() {
        // Given
        when(companyRepository.findByEmailContainingIgnoreCase("company"))
                .thenReturn(testCompanies);

        // When
        List<Company> result = companyService.searchCompaniesByEmail("company");

        // Then
        assertEquals(2, result.size());
        verify(companyRepository).findByEmailContainingIgnoreCase("company");
    }

    @Test
    void getCompaniesWithPagination_ShouldReturnPagedResults() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Company> pagedCompanies = new PageImpl<>(testCompanies);
        when(companyRepository.findAll(any(Pageable.class))).thenReturn(pagedCompanies);

        // When
        Page<Company> result = companyService.getCompaniesWithPagination(0, 10);

        // Then
        assertEquals(2, result.getContent().size());
        verify(companyRepository).findAll(any(Pageable.class));
    }

    @Test
    void isValidEmail_WithValidEmail_ShouldReturnTrue() {
        // When
        boolean result = companyService.isValidEmail("test@company.com");

        // Then
        assertTrue(result);
    }

    @Test
    void isValidEmail_WithInvalidEmail_ShouldReturnFalse() {
        // When
        boolean result = companyService.isValidEmail("invalid-email");

        // Then
        assertFalse(result);
    }

    @Test
    void isValidEmail_WithNullEmail_ShouldReturnFalse() {
        // When
        boolean result = companyService.isValidEmail(null);

        // Then
        assertFalse(result);
    }

    @Test
    void isValidCompanyName_WithValidName_ShouldReturnTrue() {
        // When
        boolean result = companyService.isValidCompanyName("Valid Company Name");

        // Then
        assertTrue(result);
    }

    @Test
    void isValidCompanyName_WithTooShortName_ShouldReturnFalse() {
        // When
        boolean result = companyService.isValidCompanyName("A");

        // Then
        assertFalse(result);
    }

    @Test
    void isValidCompanyName_WithTooLongName_ShouldReturnFalse() {
        // When
        String longName = "A".repeat(51);
        boolean result = companyService.isValidCompanyName(longName);

        // Then
        assertFalse(result);
    }

    @Test
    void getAllCompanyNames_ShouldReturnSortedNames() {
        // Given
        when(companyRepository.findAllByOrderByCompanyNameAsc()).thenReturn(testCompanies);

        // When
        List<String> result = companyService.getAllCompanyNames();

        // Then
        assertEquals(2, result.size());
        assertEquals("Test Company", result.get(0));
        assertEquals("Second Company", result.get(1));
        verify(companyRepository).findAllByOrderByCompanyNameAsc();
    }

    @Test
    void getAllCompanyEmails_ShouldReturnSortedEmails() {
        // Given
        when(companyRepository.findAllByOrderByEmailAsc()).thenReturn(testCompanies);

        // When
        List<String> result = companyService.getAllCompanyEmails();

        // Then
        assertEquals(2, result.size());
        assertEquals("test@company.com", result.get(0));
        assertEquals("second@company.com", result.get(1));
        verify(companyRepository).findAllByOrderByEmailAsc();
    }

    @Test
    void getCompanyStatistics_ShouldReturnStatistics() {
        // Given
        when(companyRepository.count()).thenReturn(10L);

        // When
        CompanyService.CompanyStatistics stats = companyService.getCompanyStatistics();

        // Then
        assertNotNull(stats);
        assertEquals(10L, stats.getTotalCompanies());
    }

    @Test
    void createDefaultCompanies_ShouldCreateNonExistingCompanies() {
        // Given
        when(companyRepository.existsByEmail(anyString())).thenReturn(false);
        when(companyRepository.existsByCompanyName(anyString())).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        List<Company> result = companyService.createDefaultCompanies();

        // Then
        assertEquals(5, result.size());
        verify(companyRepository, times(5)).save(any(Company.class));
    }


}