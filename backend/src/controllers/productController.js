const ProductModel = require('../models/productModel');

const getAllProducts = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=60');
    const products = await ProductModel.findAll();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
};
