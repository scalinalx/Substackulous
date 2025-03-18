# Troubleshooting Guide Images

This directory needs to contain the following images referenced in the troubleshooting guide:

1. `image1.png` - Delete cookies screenshot
2. `image2.png` - Email confirmation screenshot
3. `image3.png` - Reload page prompt screenshot
4. `image4.png` - Homepage/landing page screenshot
5. `image5.png` - Email notification screenshot
6. `image6.png` - Manage on-device site data screenshot
7. `image7.png` - Sign up form screenshot
8. `image8.png` - Frozen window screenshot
9. `image9.png` - Dashboard screenshot
10. `image10.png` - Cookies & site data screenshot

Please add these images to this directory to ensure the troubleshooting guide displays correctly.

## Image Path Reference

In the troubleshooting guide, images are referenced using paths like:

```html
<img alt="" src="images/image1.png" style="width: 944.00px; height: 622.00px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);" title="">
```

Since we're using Next.js, these images are served from the public directory and accessed directly at `/images/image1.png`. 