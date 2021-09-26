const mongoose = require("mongoose");
const Review = require("./reviewModel");
const utils = require("../utils");

const allowedSizes = ["s", "m", "l", "xl", "xll"];
const allowedColors = [
  "red",
  "yellow",
  "green",
  "purple",
  "blue",
  "black",
  "white",
];
const fitTypes = ["height", "weight", "chest", "waist", "hips", "feet"];
const fitDefaultValuesMap = {
  min: 0,
  max: 100000,
};
const fitsMapDefault = fitTypes.reduce((acc, currType) => {
  acc[currType] = fitDefaultValuesMap;
  return acc;
}, {});
// console.log('fitsMapDefault:', fitsMapDefault)

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Product must have a name"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "A Product must have a price"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A Barbershop must have an owner"],
      select: false,
    },
    categories: {
      type: [String],
      validate: {
        validator(el) {
          if (!el.length) {
            throw new Error('You need at least one category')
          }
          if (el.length > 5) {
            throw new Error('A product can include maximum 5 categories')
          }
        },
      },
    },
    media: {
      type: {
        mainImage: {
          type: String,
          default:
            "https://image.shutterstock.com/image-vector/vintage-barbershop-logo-vector-template-260nw-1892740417.jpg",
        },
        imagesGallery: {
          type: [String],
          default: [],
        },
      },
      default: null,
    },
    inventory: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "You must give an inventory"],
      validate: {
        validator: function (el) {
          const isObject = typeof el === "object" && el !== null;
          if (!isObject) {
            throw new Error("An inventory mmust be an object");
          }

          Object.keys(el).forEach((currSizeKey) => {
            const currSize = el[currSizeKey];
            if (!allowedSizes.includes(currSizeKey)) {
              throw new Error("You gave not-allowed sizes");
            }

            const isSizeValObject =
              typeof currSize === "object" && currSize !== null;
            if (!isSizeValObject) {
              throw new Error("Sizes must be an object");
            }

            if (!currSize.fitsMap || !currSize.colorsMap) {
              throw new Error(
                "You must specify fitsMap and colorsMap for every size"
              );
            }

            //validate fitsMap
            //validate and modify (if needed) the fits map
            const fitsMap = JSON.parse(JSON.stringify(fitsMapDefault));

            // we will check which fits the user provided, and they (the fits) will override the default fits
            const recievedFitsMap = currSize.fitsMap;
            console.log("recievedFitsMap:", recievedFitsMap);
            if (recievedFitsMap) {
              const isObject =
                typeof recievedFitsMap === "object" && recievedFitsMap !== null;
              if (!isObject) {
                throw new Error(
                  `The fits map you provided is not an object (size: ${currSizeKey})`
                );
              }

              Object.keys(recievedFitsMap).forEach((currRecievedFitKey) => {
                //allow only keys of allowd fits
                if (!fitTypes.includes(currRecievedFitKey)) {
                  throw new Error(
                    "You included a not-allowed fit in your fitsMap"
                  );
                }

                //check if has a min and max, and if allowed
                const currFitVal = recievedFitsMap[currRecievedFitKey];
                const isAllowedFitVal =
                  typeof currFitVal.min === "number" &&
                  typeof currFitVal.max === "number";
                if (!isAllowedFitVal) {
                  throw new Error(`You provided not allowed fit values`);
                }

                //override
                fitsMap[currRecievedFitKey].min = currFitVal.min;
                fitsMap[currRecievedFitKey].max = currFitVal.max;
              });
            }
            console.log("fitsMap:", fitsMap);
            el[currSizeKey].fitsMap = fitsMap;

            //validate colorsMap
            Object.keys(currSize.colorsMap).forEach((currColorKey) => {
              const currColor = currSize.colorsMap[currColorKey];

              if (!allowedColors.includes(currColorKey)) {
                throw new Error(
                  `You gave not-allowed color name: ${currColorKey}`
                );
              }

              const isColorValObject =
                typeof currColor === "object" && currColor !== null;
              if (!isColorValObject) {
                throw new Error("A color mmust be an object");
              }

              const { image } = currColor;

              if (!image) {
                throw new Error(
                  `You didnt specified size: ${currSizeKey}, color: ${currColorKey} image`
                );
              }
              const isImageString = typeof image === "string";
              if (!isImageString) {
                throw new Error("Product image must be a string");
              }
            });
          });
        },
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
