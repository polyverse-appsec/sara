cat > dist/esm/package.json <<!EOF
{
    "type": "module",
    "module": "./dist/esm/",
    "exports": {
        ".": {
            "import": "./dist/esm/"
        }
    }
}
!EOF