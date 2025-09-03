import asyncio
from backend.app.ai_processor import ai_processor

async def test_csv_demo():
    with open('demo_files/vendor_euro_quote.csv', 'r') as f:
        content = f.read()
    
    print(f'Testing with CSV demo file (length: {len(content)})')
    print(f'Content preview: {content[:200]}...')
    
    result = await ai_processor.analyze_quote(content)
    print(f'Vendor: {result.vendorName}')
    print(f'Items found: {len(result.items)}')
    for item in result.items:
        print(f'- {item.description}: {item.quantity} x ${item.unitPrice} = ${item.total}')

if __name__ == "__main__":
    asyncio.run(test_csv_demo())
