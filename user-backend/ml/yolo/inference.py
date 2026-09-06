from ultralytics import YOLO
import sys
import os
import json

model = YOLO(
    r"C:\Users\Nayessha\Downloads\Flood- Fire and Smoke.yolov8\runs\detect\train\weights\best.pt"
)

# Get image path from command line
if len(sys.argv) < 2:
    print("Usage: python test_model.py <image_path>")
    sys.exit()

image_path = sys.argv[1]

if not os.path.exists(image_path):
    print(f"ERROR: Image not found: {image_path}")
    sys.exit()

# Run YOLO
# Run YOLO
results = model(image_path, conf=0.25)

for result in results:

    # Save annotated image
    annotated_path = os.path.splitext(image_path)[0] + "_annotated.jpg"
    result.save(filename=annotated_path)

    detections = []

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        detections.append({
            "class": result.names[class_id],
            "class_id": class_id,
            "confidence": round(confidence, 3),
            "bounding_box": {
                "x1": round(x1, 2),
                "y1": round(y1, 2),
                "x2": round(x2, 2),
                "y2": round(y2, 2)
            }
        })

    class_counts = {}

    for detection in detections:
        class_name = detection["class"]
        class_counts[class_name] = class_counts.get(class_name, 0) + 1


    output = {
        "image": os.path.basename(image_path),
        "image_width": result.orig_shape[1],
        "image_height": result.orig_shape[0],
        "detections": detections,
        "summary": {
            "total_detections": len(detections),
            "class_counts": class_counts
        }
    }

  
    print(json.dumps(output, indent=2))

    json_path = os.path.splitext(image_path)[0] + ".json"

    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nJSON saved to: {json_path}")
    print(f"Annotated image saved to: {annotated_path}")