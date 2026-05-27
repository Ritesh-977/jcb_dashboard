from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Generate private key
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

# Write private key (encrypted with passphrase)
with open("snowflake_key.p8", "wb") as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()  # No passphrase for simplicity
    ))

# Generate public key
public_key = private_key.public_key()

# Write public key in PEM format
with open("snowflake_key.pub", "wb") as f:
    f.write(public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ))

print("Keys generated successfully!")
print("\nPrivate key: snowflake_key.p8")
print("Public key: snowflake_key.pub")
print("\n" + "="*60)
print("NEXT STEP: Copy the public key below and send to your admin")
print("="*60 + "\n")

with open("snowflake_key.pub", "r") as f:
    public_key_text = f.read()
    # Remove header/footer and newlines for Snowflake
    public_key_clean = public_key_text.replace("-----BEGIN PUBLIC KEY-----", "")
    public_key_clean = public_key_clean.replace("-----END PUBLIC KEY-----", "")
    public_key_clean = public_key_clean.replace("\n", "")
    
    print("Public Key (formatted for Snowflake):")
    print(public_key_clean)
    print("\n" + "="*60)
    print("SQL Command for Admin to run:")
    print("="*60)
    print(f"\nALTER USER \"RITESH.SINGH@ADAGLOBAL.COM\" SET RSA_PUBLIC_KEY='{public_key_clean}';")
    print("\n")
