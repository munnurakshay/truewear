// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrueWear {

    struct Product {
        string productId;
        string batch;
        string factory;
        string owner;
        bool delivered;
        bool replaced;
    }

    mapping(string => Product) public products;
    string[] public productIds;

    // Register a new product
    function registerProduct(string memory _productId, string memory _batch, string memory _factory) public {
        require(bytes(products[_productId].productId).length == 0, "Product already exists");
        products[_productId] = Product(_productId, _batch, _factory, "", false, false);
        productIds.push(_productId);
    }

    // Mark product as delivered
    function markDelivered(string memory _productId, string memory _owner) public {
        require(bytes(products[_productId].productId).length != 0, "Product does not exist");
        Product storage p = products[_productId];
        p.delivered = true;
        p.owner = _owner;
    }

    // Mark product as replaced / returned
    function markReplaced(string memory _productId) public {
        require(bytes(products[_productId].productId).length != 0, "Product does not exist");
        Product storage p = products[_productId];
        require(p.delivered, "Product not delivered yet");
        p.replaced = true;
    }

    // Get product info
    function getProduct(string memory _productId) public view returns (
        string memory, string memory, string memory, string memory, bool, bool
    ) {
        Product memory p = products[_productId];
        return (p.productId, p.batch, p.factory, p.owner, p.delivered, p.replaced);
    }

    // Get all registered product IDs
    function getAllProducts() public view returns (string[] memory) {
        return productIds;
    }
}
