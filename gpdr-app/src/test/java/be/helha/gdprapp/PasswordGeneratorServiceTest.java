package be.helha.gdprapp;

import be.helha.gdprapp.services.PasswordGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PasswordGeneratorServiceTest {

    @InjectMocks
    private PasswordGeneratorService passwordGeneratorService;

    @Test
    void generateRandomPassword_WithDefaultLength_ShouldReturn12Characters() {
        // When
        String password = passwordGeneratorService.generateRandomPassword();

        // Then
        assertNotNull(password);
        assertEquals(12, password.length());
    }

    @Test
    void generateRandomPassword_WithSpecificLength_ShouldReturnCorrectLength() {
        // Given
        int expectedLength = 16;

        // When
        String password = passwordGeneratorService.generateRandomPassword(expectedLength);

        // Then
        assertNotNull(password);
        assertEquals(expectedLength, password.length());
    }

    @Test
    void generateRandomPassword_WithShortLength_ShouldReturnMinimum8Characters() {
        // Given
        int shortLength = 4;

        // When
        String password = passwordGeneratorService.generateRandomPassword(shortLength);

        // Then
        assertNotNull(password);
        assertEquals(8, password.length()); // Should enforce minimum length
    }

    @Test
    void generateRandomPassword_ShouldContainAllCharacterTypes() {
        // When
        String password = passwordGeneratorService.generateRandomPassword(12);

        // Then
        assertNotNull(password);
        assertTrue(containsUppercase(password), "Password should contain uppercase letters");
        assertTrue(containsLowercase(password), "Password should contain lowercase letters");
        assertTrue(containsDigit(password), "Password should contain digits");
        assertTrue(containsSpecialChar(password), "Password should contain special characters");
    }

    @Test
    void generateRandomPassword_MultipleGeneration_ShouldProduceDifferentPasswords() {
        // When
        String password1 = passwordGeneratorService.generateRandomPassword();
        String password2 = passwordGeneratorService.generateRandomPassword();
        String password3 = passwordGeneratorService.generateRandomPassword();

        // Then
        assertNotEquals(password1, password2);
        assertNotEquals(password2, password3);
        assertNotEquals(password1, password3);
    }

    @Test
    void generateSimplePassword_ShouldContainOnlyLettersAndNumbers() {
        // Given
        int length = 10;

        // When
        String password = passwordGeneratorService.generateSimplePassword(length);

        // Then
        assertNotNull(password);
        assertEquals(length, password.length());
        assertTrue(password.matches("[A-Za-z0-9]+"), "Simple password should contain only letters and numbers");
    }

    @Test
    void isStrongPassword_WithStrongPassword_ShouldReturnTrue() {
        // Given
        String strongPassword = "Abc123!@#";

        // When
        boolean result = passwordGeneratorService.isStrongPassword(strongPassword);

        // Then
        assertTrue(result);
    }

    @Test
    void isStrongPassword_WithWeakPassword_ShouldReturnFalse() {
        // Given
        String weakPassword = "password"; // No uppercase, no digits, no special chars

        // When
        boolean result = passwordGeneratorService.isStrongPassword(weakPassword);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithShortPassword_ShouldReturnFalse() {
        // Given
        String shortPassword = "Abc1!"; // Less than 8 characters

        // When
        boolean result = passwordGeneratorService.isStrongPassword(shortPassword);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithNullPassword_ShouldReturnFalse() {
        // When
        boolean result = passwordGeneratorService.isStrongPassword(null);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithoutUppercase_ShouldReturnFalse() {
        // Given
        String passwordWithoutUppercase = "abc123!@#";

        // When
        boolean result = passwordGeneratorService.isStrongPassword(passwordWithoutUppercase);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithoutLowercase_ShouldReturnFalse() {
        // Given
        String passwordWithoutLowercase = "ABC123!@#";

        // When
        boolean result = passwordGeneratorService.isStrongPassword(passwordWithoutLowercase);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithoutDigits_ShouldReturnFalse() {
        // Given
        String passwordWithoutDigits = "AbcDef!@#";

        // When
        boolean result = passwordGeneratorService.isStrongPassword(passwordWithoutDigits);

        // Then
        assertFalse(result);
    }

    @Test
    void isStrongPassword_WithoutSpecialChars_ShouldReturnFalse() {
        // Given
        String passwordWithoutSpecialChars = "AbcDef123";

        // When
        boolean result = passwordGeneratorService.isStrongPassword(passwordWithoutSpecialChars);

        // Then
        assertFalse(result);
    }

    @Test
    void generateRandomPassword_ShouldPassStrengthValidation() {
        // When
        String password = passwordGeneratorService.generateRandomPassword();

        // Then
        assertTrue(passwordGeneratorService.isStrongPassword(password),
                "Generated password should pass strength validation");
    }

    // Helper methods for testing character types
    private boolean containsUppercase(String password) {
        return password.chars().anyMatch(Character::isUpperCase);
    }

    private boolean containsLowercase(String password) {
        return password.chars().anyMatch(Character::isLowerCase);
    }

    private boolean containsDigit(String password) {
        return password.chars().anyMatch(Character::isDigit);
    }

    private boolean containsSpecialChar(String password) {
        String specialChars = "!@#$%^&*";
        return password.chars().anyMatch(ch -> specialChars.indexOf(ch) >= 0);
    }
}