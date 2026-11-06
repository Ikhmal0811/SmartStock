using Xunit;

namespace SmartStock.Tests
{
    public class SalesValidationTests
    {
        [Fact]
        public void TotalAmount_ShouldBeCalculatedCorrectly()
        {
            // Arrange
            decimal sellingPrice = 89.00m;
            decimal quantity = 3;

            // Act
            decimal totalAmount = sellingPrice * quantity;

            // Assert
            Assert.Equal(267.00m, totalAmount);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-10)]
        public void SaleQuantity_ShouldRejectZeroOrNegativeValues(int quantity)
        {
            // Arrange & Act
            bool isValid = quantity > 0;

            // Assert
            Assert.False(isValid);
        }
    }
}