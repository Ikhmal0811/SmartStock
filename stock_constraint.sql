START TRANSACTION;
ALTER TABLE products ADD CONSTRAINT "CK_products_stock_on_hand_nonnegative" CHECK (stock_on_hand >= 0);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261105003538_AddNonNegativeStockConstraint', '10.0.4');

COMMIT;

